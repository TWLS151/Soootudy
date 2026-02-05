T = int(input())

def multiply_sort(list, N):

    multi_num = []
    for i in range(N-1):                      # 리스트 내의 (끝-1) 원소에 대해
        for j in range(i+1, N):
            multi_num.append(list[i]*list[j]) # 다른 요소들과 모두 곱해 리스트에 할당

    multi_num.sort(reverse=T)                 # Hint! 내림차순 정렬 : 큰 값부터 단조증가를 검사하기 위함 !

    return multi_num


def is_monotic_increse(list1):                # 단조 증가값을 판단하는 함수

    str_list = list(map(str, list1))          # 1. 자리수 비교를 위해 int -> str

    for num in str_list:                      # 2. 리스트 안을 큰 값부터 검사
        is_increase = True                    # 초기 단조증가 여부 : True -> 처음 검사가 진행될 수 있도록

        if len(num) == 1:                     # 2-1. 한 자리수일 경우 -> 무조건 단조증가
            target = num
            break

        for idx in range(len(num)-1):         # 3. 오른쪽 숫자를 검사 (끝 -1 자리까지)
            
            if is_increase is False:          # 3-1. 단조증가가 아닐 경우 : 안쪽 for 문을 벗어나 다음 숫자로
                break                        

            if int(num[idx]) <= int(num[idx+1]): # 3-2. 다음 자리수에 대해 단조증가 or 동일할 시: 다음 자리 수 검사
                is_increase = True

            else: is_increase = False

        else:                       # 4. 모든 자릿수 검사 이후

            if is_increase is True: # 4-1. 단조 증가일 시

                target = int(num)   # 해당 값이 목표값이므로 target에 할당
                break               # 반복문 강제 종료 (else로 넘어가지 않게)

    else: target = -1               # 4-2. 모든 값이 단조증가가 아닐 시 -> -1 반환


    return target



for tc in range(1, T+1):

    N = int(input())

    num_list = list(map(int, input().split()))

    multi_list = multiply_sort(num_list, N) # 1. 주어진 리스트의 모든 곱 요소를 계산 -> 내림차순 정렬 (큰 값부터 보기 위함)

    result = is_monotic_increse(multi_list)          # 2. 단조증가 여부 파악 -> 단조증가하는 최댓값 반환

    print(f"#{tc} {result}")