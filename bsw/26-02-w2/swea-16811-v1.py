T = int(input())
for tc in range(1, T + 1):
    N = int(input())
    
    carrot_lst = list(map(int, input().split()))
    carrot_lst.sort()
    # 당근 리스트를 일단 오름차순으로 정렬
    for i in range(N-2): # 뒤에 중, 대 박스에 최소 1개가 있어야 하므로 N - 2 까지
        if carrot_lst[i] == carrot_lst[i+1]:
            continue
            # 다음 인덱스와 같으면 continue(같은 크기 당근 사이에서 슬라이싱을 못함)
        for j in range(i + 1, N-1): # 대 박스에 최소 한개가 있으므로 N - 1까지
            if carrot_lst[j] == carrot_lst[j + 1]:
                continue
                # 중간 박스에서도 마찬가지(line 11의 주석과 비슷)
            if i + 1 > N//2 or j - i > N //2 or N - 1 - j> N // 2:
                continue
                # 각 박스가 과반수인 경우 못 들어감.
            current_diff = max(i + 1, j - i, N - 1 - j)- min(i + 1, j - i, N - 1 - j)
            
        # 이러면 소 박스에 i + 1(0~i) 개, 중 박스에 j - i(i~j) 개, 대 박스에 N - 1 - j개 담긴다.
        # 위의 과정은 슬라이싱 하는 범위를 정하는 것
        # 다음 구현이 흠..