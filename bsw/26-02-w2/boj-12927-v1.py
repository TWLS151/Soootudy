# boj 12927 : 배수 스위치
lamp = [0] + list(input()) # 배수를 맞추기 위해 [0] 추가
count = 0
N = len(lamp)
for i in range(1, N):
    if lamp[i] == 'Y': # Y 인 경우 사용 한번 함.
        count += 1    
        for j in range(i, N, i): # i 번위치에서 시작, i의 배수 나열 <- 여기가 핵심인듯?
            if lamp[j] == 'Y':
                lamp[j] = 'N'
            else:
                lamp[j] = 'Y'
        

print(count)